(function () {
  var storageKey = 'darkMode';
  var autoModeKey = 'autoMode';
  var classNameDark = 'dark-mode';
  var classNameLight = 'light-mode';

  function setClassOnDocumentBody(darkMode) {
    document.body.classList.add(darkMode ? classNameDark : classNameLight);
    document.body.classList.remove(darkMode ? classNameLight : classNameDark);
  }

  var preferDarkQuery = '(prefers-color-scheme: dark)';
  var mql = window.matchMedia(preferDarkQuery);
  var supportsColorSchemeQuery = mql.media === preferDarkQuery;

  var localStorageTheme = null;
  try {
    localStorageTheme = localStorage.getItem(storageKey);
  } catch (err) {
    console.error(err);
  }

  var localStorageExists = localStorageTheme !== null;

  if (localStorageExists) {
    localStorageTheme = JSON.parse(localStorageTheme);
  }

  var localStorageAuto = null;
  try {
    localStorageAuto = localStorage.getItem(autoModeKey);
  } catch (err) {
    console.error(err);
  }

  if (localStorageExists) {
    setClassOnDocumentBody(localStorageTheme);
  } else if (supportsColorSchemeQuery && localStorageAuto == 1) {
    setClassOnDocumentBody(mql.matches);
    localStorage.setItem(storageKey, mql.matches);
  } else {
    var isDarkMode = document.body.classList.contains(classNameDark);
    localStorage.setItem(storageKey, JSON.stringify(isDarkMode));
  }
})();
