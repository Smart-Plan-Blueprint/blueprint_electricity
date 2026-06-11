export default function NavButton({ active, icon: Icon, children, ...props }) {
  return (
    <button className={active ? "active" : ""} type="button" {...props}>
      <Icon size={18} />
      {children}
    </button>
  );
}
