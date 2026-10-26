import SiteLayout from "./(site)/layout";
import NotFound from "./(site)/not-found";

/** Unmatched URLs: same page chrome as the rest of the site. */
export default function RootNotFound() {
  return (
    <SiteLayout>
      <NotFound />
    </SiteLayout>
  );
}
