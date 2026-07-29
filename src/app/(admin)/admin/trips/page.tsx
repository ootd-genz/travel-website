import { CmsListPage } from "../_components/cms-pages";
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { return <CmsListPage resource="trips" searchParams={searchParams} />; }
