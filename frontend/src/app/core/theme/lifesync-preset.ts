import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/**
 * LifeSync PrimeNG preset.
 * Semantic colors point at the CSS variables defined in styles.css, so light/dark
 * switching is driven by one set of tokens (html.dark-mode) for both PrimeNG and Tailwind.
 */
const scheme = {
  primary: {
    color: 'var(--accent)',
    contrastColor: '#ffffff',
    hoverColor: 'var(--accent-hover)',
    activeColor: 'var(--accent-hover)',
  },
  highlight: {
    background: 'var(--accent-soft)',
    focusBackground: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    focusColor: 'var(--accent-text)',
  },
  mask: { background: 'var(--mask)', color: 'var(--ink-2)' },
  formField: {
    background: 'var(--surface)',
    disabledBackground: 'var(--surface-2)',
    filledBackground: 'var(--surface-2)',
    filledHoverBackground: 'var(--surface-2)',
    filledFocusBackground: 'var(--surface-2)',
    borderColor: 'var(--line-strong)',
    hoverBorderColor: 'var(--muted)',
    focusBorderColor: 'var(--accent)',
    invalidBorderColor: 'var(--neg)',
    color: 'var(--ink)',
    disabledColor: 'var(--muted)',
    placeholderColor: 'var(--muted)',
    invalidPlaceholderColor: 'var(--neg)',
    floatLabelColor: 'var(--muted)',
    floatLabelFocusColor: 'var(--accent)',
    floatLabelActiveColor: 'var(--muted)',
    floatLabelInvalidColor: 'var(--neg)',
    iconColor: 'var(--muted)',
    shadow: '0 1px 2px rgba(11, 11, 11, 0.04)',
  },
  text: {
    color: 'var(--ink)',
    hoverColor: 'var(--ink)',
    mutedColor: 'var(--muted)',
    hoverMutedColor: 'var(--ink-2)',
  },
  content: {
    background: 'var(--surface)',
    hoverBackground: 'var(--surface-2)',
    borderColor: 'var(--line)',
    color: 'var(--ink)',
    hoverColor: 'var(--ink)',
  },
  overlay: {
    select: { background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' },
    popover: { background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' },
    modal: { background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' },
  },
  list: {
    option: {
      focusBackground: 'var(--surface-2)',
      selectedBackground: 'var(--accent-soft)',
      selectedFocusBackground: 'var(--accent-soft)',
      color: 'var(--ink)',
      focusColor: 'var(--ink)',
      selectedColor: 'var(--accent-text)',
      selectedFocusColor: 'var(--accent-text)',
      icon: { color: 'var(--muted)', focusColor: 'var(--ink-2)' },
    },
    optionGroup: { background: 'transparent', color: 'var(--muted)' },
  },
  navigation: {
    item: {
      focusBackground: 'var(--surface-2)',
      activeBackground: 'var(--surface-2)',
      color: 'var(--ink-2)',
      focusColor: 'var(--ink)',
      activeColor: 'var(--ink)',
      icon: { color: 'var(--muted)', focusColor: 'var(--ink-2)', activeColor: 'var(--ink-2)' },
    },
    submenuLabel: { background: 'transparent', color: 'var(--muted)' },
    submenuIcon: { color: 'var(--muted)', focusColor: 'var(--ink-2)', activeColor: 'var(--ink-2)' },
  },
};

const popShadow = 'var(--shadow-pop)';

/** Same values in both schemes: the CSS variables already switch with the theme. */
const both = <T>(v: T) => ({ light: v, dark: v });

export const LifeSyncPreset = definePreset(Aura, {
  primitive: {
    borderRadius: { none: '0', xs: '3px', sm: '5px', md: '7px', lg: '10px', xl: '12px' },
  },
  semantic: {
    transitionDuration: '0.15s',
    focusRing: { width: '2px', style: 'solid', color: 'var(--accent)', offset: '2px', shadow: 'none' },
    primary: {
      50: '#eef5fd', 100: '#cde2fb', 200: '#9ec5f4', 300: '#6da7ec', 400: '#3987e5', 500: '#2a78d6',
      600: '#256abf', 700: '#1c5cab', 800: '#184f95', 900: '#104281', 950: '#0d366b',
    },
    formField: {
      paddingX: '0.75rem',
      paddingY: '0.5rem',
      borderRadius: '{border.radius.md}',
      focusRing: { width: '0', style: 'none', color: 'transparent', offset: '0', shadow: '0 0 0 3px var(--accent-ring)' },
    },
    list: {
      padding: '0.25rem',
      gap: '1px',
      option: { padding: '0.4375rem 0.625rem', borderRadius: '{border.radius.sm}' },
      optionGroup: { padding: '0.5rem 0.625rem 0.25rem', fontWeight: '500' },
    },
    navigation: {
      list: { padding: '0.25rem', gap: '1px' },
      item: { padding: '0.4375rem 0.625rem', borderRadius: '{border.radius.sm}', gap: '0.5rem' },
    },
    overlay: {
      select: { borderRadius: '{border.radius.lg}', shadow: popShadow },
      popover: { borderRadius: '{border.radius.lg}', padding: '0.75rem', shadow: popShadow },
      modal: { borderRadius: '{border.radius.xl}', padding: '1.5rem', shadow: 'var(--shadow-modal)' },
      navigation: { shadow: popShadow },
    },
    colorScheme: {
      light: {
        ...scheme,
        surface: {
          0: '#ffffff', 50: '#f9f9f7', 100: '#f3f3f0', 200: '#e6e5df', 300: '#d6d5cd', 400: '#b5b3ab',
          500: '#898781', 600: '#6b6964', 700: '#52514e', 800: '#2c2c2a', 900: '#1a1a19', 950: '#0b0b0b',
        },
      },
      dark: {
        ...scheme,
        surface: {
          0: '#ffffff', 50: '#f5f5f2', 100: '#e8e7e1', 200: '#c3c2b7', 300: '#a8a69e', 400: '#898781',
          500: '#6b6964', 600: '#4a4946', 700: '#383835', 800: '#2c2c2a', 900: '#1a1a19', 950: '#0d0d0d',
        },
      },
    },
  },
  components: {
    button: {
      root: { label: { fontWeight: '500' }, iconOnlyWidth: '2.25rem', gap: '0.4375rem' },
      colorScheme: both({
        root: {
          secondary: {
            background: 'var(--surface)', hoverBackground: 'var(--surface-2)', activeBackground: 'var(--surface-2)',
            borderColor: 'var(--line-strong)', hoverBorderColor: 'var(--line-strong)', activeBorderColor: 'var(--line-strong)',
            color: 'var(--ink)', hoverColor: 'var(--ink)', activeColor: 'var(--ink)',
            focusRing: { color: 'var(--accent)', shadow: 'none' },
          },
          contrast: {
            background: 'var(--ink)', hoverBackground: 'var(--ink-2)', activeBackground: 'var(--ink-2)',
            borderColor: 'var(--ink)', hoverBorderColor: 'var(--ink-2)', activeBorderColor: 'var(--ink-2)',
            color: 'var(--canvas)', hoverColor: 'var(--canvas)', activeColor: 'var(--canvas)',
            focusRing: { color: 'var(--accent)', shadow: 'none' },
          },
          danger: {
            background: 'var(--neg)', hoverBackground: 'var(--neg-hover)', activeBackground: 'var(--neg-hover)',
            borderColor: 'var(--neg)', hoverBorderColor: 'var(--neg-hover)', activeBorderColor: 'var(--neg-hover)',
            color: '#ffffff', hoverColor: '#ffffff', activeColor: '#ffffff',
            focusRing: { color: 'var(--neg)', shadow: 'none' },
          },
        },
        text: {
          primary: { hoverBackground: 'var(--accent-soft)', activeBackground: 'var(--accent-soft)', color: 'var(--accent)' },
          secondary: { hoverBackground: 'var(--surface-2)', activeBackground: 'var(--surface-2)', color: 'var(--ink-2)' },
          danger: { hoverBackground: 'color-mix(in oklab, var(--neg) 10%, transparent)', activeBackground: 'color-mix(in oklab, var(--neg) 14%, transparent)', color: 'var(--neg)' },
        },
      }),
    },
    card: {
      root: { borderRadius: '{border.radius.lg}', shadow: 'none' },
      body: { padding: '1.125rem', gap: '0.75rem' },
      title: { fontSize: '0.875rem', fontWeight: '600' },
    },
    dialog: {
      header: { padding: '1.25rem 1.5rem 0.5rem', gap: '0.5rem' },
      title: { fontSize: '1rem', fontWeight: '600' },
      content: { padding: '0.5rem 1.5rem 1.5rem' },
      footer: { padding: '0.875rem 1.5rem', gap: '0.5rem' },
    },
    confirmdialog: { icon: { size: '1.25rem', color: 'var(--neg)' }, content: { gap: '0.875rem' } },
    datatable: {
      headerCell: { padding: '0.625rem 0.75rem', borderColor: 'var(--line)' },
      bodyCell: { padding: '0.6875rem 0.75rem', borderColor: 'var(--line)' },
      columnTitle: { fontWeight: '500' },
      footerCell: { padding: '0.625rem 0.75rem' },
      colorScheme: both({ root: { borderColor: 'var(--line)' }, row: { stripedBackground: 'var(--surface-2)' } }),
    },
    paginator: {
      root: { padding: '0.625rem 0.75rem', gap: '0.25rem', background: 'transparent' },
      navButton: { width: '2rem', height: '2rem', borderRadius: '{border.radius.md}' },
    },
    toast: {
      root: { width: '22rem', borderRadius: '{border.radius.lg}' },
      icon: { size: '1.125rem' },
      content: { padding: '0.875rem 1rem', gap: '0.625rem' },
      summary: { fontWeight: '600', fontSize: '0.875rem' },
      detail: { fontWeight: '400', fontSize: '0.8125rem' },
      colorScheme: both(
        Object.fromEntries(
          [
            ['info', 'var(--accent)'],
            ['success', 'var(--pos)'],
            ['warn', 'var(--warn)'],
            ['error', 'var(--neg)'],
            ['secondary', 'var(--ink-2)'],
            ['contrast', 'var(--ink-2)'],
          ].map(([key, color]) => [
            key,
            {
              background: 'var(--surface)', borderColor: 'var(--line)', color, detailColor: 'var(--ink-2)',
              shadow: popShadow, closeButton: { hoverBackground: 'var(--surface-2)', focusRing: { color: 'var(--accent)', shadow: 'none' } },
            },
          ]),
        ),
      ),
    },
    tooltip: {
      root: { padding: '0.375rem 0.625rem', borderRadius: '{border.radius.md}', maxWidth: '16rem' },
      colorScheme: both({ root: { background: 'var(--ink)', color: 'var(--canvas)' } }),
    },
    tag: {
      root: { fontSize: '0.75rem', fontWeight: '500', padding: '0.125rem 0.5rem', borderRadius: '{border.radius.sm}' },
      colorScheme: both({
        primary: { background: 'var(--accent-soft)', color: 'var(--accent-text)' },
        secondary: { background: 'var(--surface-2)', color: 'var(--ink-2)' },
        success: { background: 'color-mix(in oklab, var(--pos) 12%, transparent)', color: 'var(--pos)' },
        danger: { background: 'color-mix(in oklab, var(--neg) 12%, transparent)', color: 'var(--neg)' },
        warn: { background: 'color-mix(in oklab, var(--warn) 16%, transparent)', color: 'var(--warn-text)' },
        info: { background: 'var(--accent-soft)', color: 'var(--accent-text)' },
      }),
    },
    tabs: {
      tab: { padding: '0.625rem 0.875rem', fontWeight: '500', activeColor: 'var(--ink)' },
      tabpanel: { padding: '1.25rem 0 0', background: 'transparent' },
      tablist: { background: 'transparent' },
    },
    skeleton: {
      colorScheme: both({ root: { background: 'var(--surface-2)', animationBackground: 'var(--skeleton-shine)' } }),
    },
    datepicker: {
      panel: { padding: '0.75rem' },
      date: { width: '2.125rem', height: '2.125rem', borderRadius: '{border.radius.md}' },
      colorScheme: both({ today: { background: 'var(--surface-2)', color: 'var(--ink)' } }),
    },
    menu: { root: { borderRadius: '{border.radius.lg}' } },
    avatar: {
      root: { background: 'var(--accent-soft)', color: 'var(--accent-text)', fontSize: '0.8125rem', borderRadius: '50%' },
    },
  },
});
