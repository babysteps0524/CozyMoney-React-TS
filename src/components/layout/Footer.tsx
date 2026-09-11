export function Footer() {
  return (
    <footer className="mt-16 bg-cm-primary text-white">
      <div className="page py-8 text-center">
        <div className="flex justify-center gap-5 mb-3">
          <a href="/privacy/" className="text-sm underline">
            개인정보처리방침
          </a>
        </div>
        <p className="m-0 text-xs opacity-75">
          © {new Date().getFullYear()} CozyMoney
        </p>
      </div>
    </footer>
  );
}
