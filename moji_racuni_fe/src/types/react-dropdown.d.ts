declare module "react-dropdown" {
  import { FC } from "react";

  export interface Option {
    value: string;
    label: string;
    className?: string;
    data?: unknown;
  }

  export interface ReactDropdownProps {
    options: Array<string | Option>;
    onChange?: (option: Option) => void;
    value?: string | Option;
    placeholder?: string;
    className?: string;
    controlClassName?: string;
    menuClassName?: string;
    arrowClassName?: string;
    placeholderClassName?: string;
    disabled?: boolean;
  }

  const Dropdown: FC<ReactDropdownProps>;
  export default Dropdown;
}
