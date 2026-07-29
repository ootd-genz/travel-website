import { CmsEditorPage } from "../../_components/cms-pages";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <CmsEditorPage resource="activities" id={(await params).id} />; }
