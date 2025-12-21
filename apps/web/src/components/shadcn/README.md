# shadcn Components

This folder contains vanilla shadcn/ui components for use with libraries that require the original Radix-based implementations (e.g., DiceUI).

## When to use

- **This folder (`shadcn/`)**: Use these components when integrating with third-party libraries like DiceUI that expect standard shadcn/ui primitives built on Radix UI.

- **`ui/` folder**: Use for regular application components. These are based on [CossUI](https://coss-ui.com) and [Base UI](https://base-ui.com), providing an alternative component architecture.

## Why two folders?

Some libraries have peer dependencies on vanilla shadcn components and won't work correctly with the CossUI/Base UI variants in `ui/`. This folder ensures compatibility with those libraries while allowing the rest of the app to use the preferred component system.
