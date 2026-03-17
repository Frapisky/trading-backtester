import Layout from "@/components/layout/Layout";

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function DashboardLayout({ title, children }: Props) {
  return <Layout title={title}>{children}</Layout>;
}

