import { useEffect, type MouseEvent } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SiteHeader } from "./chrome/SiteHeader";
import { SiteFooter } from "./chrome/SiteFooter";
import { useSiteEnhancements } from "./useSiteEnhancements";
import { getPageSeo } from "./seo";
import { useDocumentSeo } from "@/lib/seo/useDocumentSeo";
import "./website.css";

const isInternal = (href: string) =>
  href.startsWith("/") && !href.startsWith("//");

const SiteLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  useSiteEnhancements(pathname);
  useDocumentSeo(getPageSeo(pathname));

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || anchor.target === "_blank" || !isInternal(href)) return;
    event.preventDefault();
    navigate(href);
  };

  return (
    <div className="mh-site" onClick={handleClick}>
      <a href="#mh-main" className="mh-skip">
        Naar hoofdinhoud
      </a>
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </div>
  );
};

export default SiteLayout;
