export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="brand" href="https://github.com/Cloud2BR" target="_blank" rel="noreferrer">
          <img className="brand__mark" src="https://avatars.githubusercontent.com/u/265654976?v=4" alt="" />
          <span className="brand__name">Cloud2BR</span>
        </a>
        <nav className="site-header__nav">
          <a
            className="header-link"
            href="https://github.com/Cloud2BR/File-Format-Converter"
            target="_blank"
            rel="noreferrer"
          >
            Repository
          </a>
          <a
            className="header-link owner-link"
            href="https://github.com/brown9804"
            target="_blank"
            rel="noreferrer"
          >
            <img src="https://github.com/brown9804.png?size=80" alt="" />
            <span>brown9804</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
