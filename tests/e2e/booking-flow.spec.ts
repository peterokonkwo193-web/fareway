import { expect, test, type Page } from "@playwright/test";

/** Picks the first suggestion for a query in a place combobox. */
async function choosePlace(page: Page, field: "From" | "To", query: string, expected: RegExp) {
  const input = page.getByRole("combobox", { name: field });
  await input.click();
  await input.fill(query);
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue(expected);
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "fw_cookie_ok", value: "1", url: baseURL! }]);
});

test("search → flight details → booking request → confirmation → lookup", async ({ page, browser }) => {
  // 1. Search from the home page using only the keyboard for the calendar.
  await page.goto("/");
  // The search form reports aria-busy until it has hydrated and restored saved state.
  await expect(page.locator('form[aria-busy="false"]').first()).toBeVisible();
  await choosePlace(page, "From", "LHR", /London \(LHR\)/);
  await choosePlace(page, "To", "new york", /New York \(Any\)/);

  await page.getByRole("button", { name: /^Depart/ }).click();
  await expect(page.getByRole("grid").first()).toBeVisible();
  await page.keyboard.press("PageDown"); // next month
  await page.keyboard.press("Enter"); // departure
  for (let i = 0; i < 7; i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter"); // return, closes the calendar
  await expect(page.getByRole("button", { name: /^Return: (?!Choose)/ })).toBeVisible();

  await page.getByRole("button", { name: "Search flights" }).click();
  await expect(page).toHaveURL(/\/flights\?trip=return&from=LHR&to=city%3ANYC/);

  // 2. Results: cards, sort tabs and a URL-synced filter.
  const cards = page.getByRole("article");
  await expect(cards.first()).toBeVisible();
  await page.getByRole("radio", { name: /Cheapest/ }).click();
  await expect(page).toHaveURL(/sort=cheapest/);

  // 3. Flight details.
  await page.getByRole("link", { name: /View deal/ }).first().click();
  await expect(page.getByRole("heading", { name: "Outbound journey" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Return journey" })).toBeVisible();
  await expect(page.getByText(/This price is indicative/)).toBeVisible();

  // 4. Booking request form: validation first, then a valid submission.
  await page.getByRole("link", { name: "Request this flight" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Request this flight" })).toBeVisible();
  await expect(page.getByText(/No payment is taken now/)).toBeVisible();
  await expect(page.locator('input[autocomplete^="cc-"], input[name*="card" i]')).toHaveCount(0);

  await page.getByRole("button", { name: "Send booking request" }).click();
  await expect(page.getByText("Enter your full name as on your passport")).toBeVisible();

  await page.getByLabel("Full name as on passport").fill("Grace Brewster Hopper");
  await page.getByLabel("Email address").fill("grace@example.com");
  await page.getByLabel("Country dialling code").selectOption("US");
  await page.getByLabel("Phone number", { exact: true }).fill("202 555 0143");
  await page.getByLabel("First and middle names").fill("Grace Brewster");
  await page.getByLabel("Last name").fill("Hopper");
  await page.getByLabel("Date of birth").fill("1986-12-09");
  await page.getByLabel("Passport nationality").selectOption("US");
  await page.getByRole("checkbox", { name: /I have read the terms/ }).click();
  await page.getByRole("button", { name: "Send booking request" }).click();

  // 5. Confirmation page.
  await expect(page).toHaveURL(/\/booking\/FW-\d{6}-[2-9A-HJKMNP-Z]{5}$/);
  const reference = page.url().split("/booking/")[1];
  await expect(
    page.getByText("Your request is saved. To confirm your booking and pay, contact our customer care team and quote your reference number."),
  ).toBeVisible();
  await expect(page.getByText(reference, { exact: true })).toBeVisible();
  await expect(page.getByText("Pending").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
  const whatsapp = page.getByRole("link", { name: /WhatsApp/ });
  await expect(whatsapp).toHaveAttribute("href", new RegExp(`wa\\.me/\\d+\\?text=.*${reference}`));
  await expect(page.getByRole("link", { name: /Email us/ })).toHaveAttribute("href", new RegExp(`^mailto:.*${reference}`));
  await expect(page.getByText(/only confirmed after payment is completed through customer care/).first()).toBeVisible();

  // 6. Another browser cannot see it without reference + email.
  const other = await browser.newContext();
  const page2 = await other.newPage();
  await page2.goto(`/booking/${reference}`);
  await expect(page2).toHaveURL(new RegExp(`/booking/lookup\\?ref=${reference}`));
  await page2.getByLabel("Email address").fill("someone-else@example.com");
  await page2.getByRole("button", { name: "Find request" }).click();
  await expect(page2.getByText(/We could not find a request/)).toBeVisible();
  await page2.getByLabel("Email address").fill("grace@example.com");
  await page2.getByRole("button", { name: "Find request" }).click();
  await expect(page2).toHaveURL(new RegExp(`/booking/${reference}$`));
  await other.close();
});

test("bots filling the honeypot are not saved", async ({ request, baseURL }) => {
  const res = await request.post("/api/bookings", {
    headers: { "Content-Type": "application/json", Origin: baseURL! },
    data: { offerId: "m1.x", form: { website: "http://spam.example" } },
  });
  expect(res.status()).toBe(202);
  expect((await res.json()).reference).toBeNull();
});

test("form endpoints reject cross-site requests", async ({ request }) => {
  const res = await request.post("/api/bookings", {
    headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
    data: { offerId: "m1.x", form: {} },
  });
  expect(res.status()).toBe(403);
});
