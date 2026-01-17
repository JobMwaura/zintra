import CareersNavbar from '@/components/careers/CareersNavbar';

export default function CareersLayout({ children }) {
  return (
    <>
      <CareersNavbar />
      {children}
    </>
  );
}
