import clsx from "clsx";

export function InnerPage({
  children,
  isFullPage = false,
}: {
  children: React.ReactNode;
  isFullPage?: boolean;
}) {
  const classes = clsx({
    container: !isFullPage,
    "pt-[59px]": true,
    "text-left": true,
  });

  return (
    <div className={classes}>
      {!isFullPage && <div className="pt-5 md:pt-10"></div>}
      {children}
      {!isFullPage && <div className="pt-5 md:pt-10"></div>}
    </div>
  );
}
