import { redirect } from "next/navigation";

export default function LegacyRedirect({ searchParams }: { searchParams: any }) {
    // Redirect old success links to the new confirmation route
    const sessionId = searchParams.session_id;
    if (sessionId) {
        redirect(`/booking-confirmation?session_id=${sessionId}`);
    }
    redirect("/");
}
