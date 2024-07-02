import { StylesConfig } from 'react-select';

const borderRadius = 0;

interface SelectStylesParams {
  marginBottom?: number;
  fontSize?: string | number;
}

const DEFAULT_FONT_SIZE = '14px';

export function getStyles<T>(
  { marginBottom, fontSize = DEFAULT_FONT_SIZE }: SelectStylesParams = {
    fontSize: DEFAULT_FONT_SIZE,
  },
) {
  return {
    container: (provided) => ({
      ...provided,
      minWidth: '80px',
      marginBottom,
    }),
    control: () => ({
      borderRadius,
      background: '#fefaf3',
      boxShadow: '3px 3px 0px 1px #31322d',
      cursor: 'pointer',
      width: '100%',
      fontSize,
      border: '3px solid #000',
      padding: '8px 8px',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: 0,
      fontSize,
      fontWeight: 'bold',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius,
      background: '#fefaf3',
      boxShadow: '3px 3px 0px 1px #31322d',
      border: '3px solid #000',
      overflow: 'hidden',
      zIndex: 10,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#000' : '#fff',
      color: state.isSelected ? '#fff' : '#000',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize,
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize,
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '90px',
    }),
  } as StylesConfig<T>;
}
