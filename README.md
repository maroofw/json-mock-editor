# JSON Mock Editor

A fully offline, zero-dependency, simple and clean web application designed to help developers effortlessly create, edit and format JSON mock responses. This tool was specifically built to streamline pasting mock data into **Android Studio's Network Inspector**, but is perfect for any workflow requiring quick JSON manipulation.

## Features

- **100% Offline & Serverless**: Runs entirely in the browser. No node modules, no build steps, and no external CDNs required.
- **Premium Aesthetics**: Features a sleek dark mode with glassmorphic elements and smooth micro-animations.
- **Smart JSON Editor**: 
  - Real-time syntax validation.
  - One-click **Prettify** and **Minify** formatting.
- **Interactive Tree View**: Automatically parses JSON into a beautifully syntax-highlighted, collapsible tree. You can even click on primitive values (strings, numbers, booleans) to edit them inline.
- **Local Storage Management**: Save and organize multiple API mock responses in the sidebar. They persist between sessions using your browser's local storage.
- **Android Studio Ready**: A prominent "Copy Mock" button copies the finalized JSON directly to your clipboard, perfectly formatted to be pasted into an Android Studio Network Inspector rule.

## How to Use

1. Clone or download this repository.
2. Double-click `index.html` to open it in any modern web browser.
3. Use the **New Mock** button to create a new entry.
4. Paste your raw JSON into the editor.
5. Format it, validate it, and hit **Copy Mock** when you are ready to use it.

## Tech Stack

Built entirely with Vanilla web technologies:
- **HTML5**
- **CSS3** (CSS Variables, Flexbox, Grid)
- **Vanilla JavaScript** (ES6+)

No frameworks or libraries were used, ensuring blazing fast load times and maximum portability.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests. Contributions to improve the UI, add new editor features, or enhance the tree-view capabilities are highly welcome!

## License

This project is open source and available under the [MIT License](LICENSE).
