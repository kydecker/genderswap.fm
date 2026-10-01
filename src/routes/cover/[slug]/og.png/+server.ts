import { redirect } from "@sveltejs/kit";

export function GET({ params }) {
  redirect(308, `/cover/${params.slug}/og.jpg`);
}
