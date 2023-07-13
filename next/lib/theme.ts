import {
  createMultiStyleConfigHelpers,
  extendTheme,
  useColorModeValue,
  type ThemeConfig,
} from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';
import { modalAnatomy as parts } from '@chakra-ui/anatomy';
const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys);

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: true,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: mode('white', 'millgrey.200')(props),
      },
    }),
  },
  colors: {
    millgrey: {
      100: '#1D1C1C',
      200: '#272522',
      300: '#312E2B',
      700: '#312E2B',
    },
    millgreen: {
      50: '#eefae4',
      100: '#d6eac5',
      200: '#bddaa3',
      300: '#a3cb7f',
      400: '#8abc5c',
      500: '#71a343',
      600: '#577f33',
      700: '#3e5a23',
      800: '#243712',
      900: '#091400',
    },
  },
  components: {
    Modal: {
      baseStyle: (props) => ({
        dialog: {
          bg: mode('white', 'millgrey.200')(props),
        },
      }),
    },
    Drawer: {
      baseStyle: (props) => ({
        dialog: {
          bg: mode('white', 'millgrey.200')(props),
        },
      }),
    },
    Button: {
      variants: {
        millgreen: {
          bg: 'millgreen.500',
          color: 'white',
          _hover: {
            bg: 'millgreen.600',
          },
        },
        millgreenoutline: (props) => ({
          bg: 'transparent',
          color: 'millgreen.500',
          border: '1px solid',
          borderColor: 'millgreen.500',
          _hover: {
            bg: mode('millgreen.50', 'millgreen.500')(props),
            color: mode('millgreen.500', 'white')(props),
          },
        }),
      },
    },
    Input: {
      variants: {
        millgreen: (props) => ({
          field: {
            bg: mode('gray.100', 'whiteAlpha.50')(props),
            border: '2px solid',
            borderColor: 'transparent',
            _focus: {
              border: '2px solid',
              borderColor: 'millgreen.500',
            },
            _hover: {
              bg: mode('#E2E8F0', '#34322F')(props),
            },
          },
        }),
      },
    },
    Menu: {
      variants: {
        millgreen: (props) => ({
          item: {
            bg: mode('white', 'millgrey.200')(props),
            _hover: {
              bg: mode('millgreen.50', 'millgreen.500')(props),
              color: mode('millgreen.500', 'white')(props),
            },
          },
          list: {
            bg: mode('white', 'millgrey.200')(props),
          },
        }),
      },
    },
    Toast: {
      variants: {
        millgreen: (props) => ({
          container: {
            bg: mode('millgreen.50', 'millgreen.500')(props),
            color: mode('millgreen.500', 'white')(props),
          },
        }),
      },
    },
    Card: {
      baseStyle: (props) => ({
        container: {
          bg: mode('white', 'millgrey.300')(props),
        },
      }),
    },
    Table: {
      variants: {
        leaderboard: (props) => ({
          thead: {
            tr: {
              color: 'teal',
            },
          },
        }),
      },
    },
  },
});

export default theme;
