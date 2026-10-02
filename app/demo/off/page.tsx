import { redirect } from "next/navigation";

// /demo-оор асаасан жишээ ачааллын мэдээллийг унтрааж, нүүр хуудас руу шилжүүлнэ.
export default function DemoOffPage() {
  redirect("/?demo=0");
}
