import { redirect } from "next/navigation";

// Танилцуулгад: /demo нь жишээ ачааллын мэдээллийг асааж, нүүр хуудас руу шилжүүлнэ (lib/demoBusyness.ts).
// Унтраах: /demo/off.
export default function DemoPage() {
  redirect("/?demo=1");
}
