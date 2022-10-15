import { alpha, darken, styled } from "@mui/material/styles";
import Select, { SelectProps } from "@mui/material/Select";
import InputBase from "@mui/material/InputBase";
import MenuItem, { MenuItemProps } from "@mui/material/MenuItem";

const StyledInput = styled(InputBase)(({ theme }) => ({
    "& .MuiInputBase-input": {
        borderRadius: 4,
        position: "relative",
        backgroundColor: theme.palette.mode === "light" ? alpha(theme.palette.common.black, 0.05) : darken(theme.palette.background.default, 0.2),
        fontSize: 14,
        fontWeight: theme.typography.fontWeightMedium,
        padding: "16px 26px 16px 12px",
        transition: theme.transitions.create(["border-color", "box-shadow"]),
        "&:focus": {
            borderRadius: 4
        }
    }
}));

export function FilledSelect<T>(props: SelectProps<T>) {
    return <Select
        {...props}
        MenuProps={{
            MenuListProps: {
                disablePadding: true,
                style: {
                    borderRadius: 4
                }
            },
            elevation: 1
        }}
        input={<StyledInput/>}
    >
        {props.children}
    </Select>
}

export function FilledMenuItem(props: MenuItemProps) {
    return <MenuItem
        {...props}
        sx={(theme) => ({
            backgroundColor: "transparent",
            fontSize: 14,
            fontWeight: theme.typography.fontWeightMedium,
            paddingTop: theme.spacing(1),
            paddingBottom: theme.spacing(1),
            "&:hover": {
                backgroundColor: darken(theme.palette.background.default, 0.1)
            },
            "&:focus": {
                backgroundColor: darken(theme.palette.background.default, 0.2),
                "& .MuiListItemIcon-root, & .MuiListItemText-primary": {
                    color: theme.palette.text.primary
                }
            }
        })}
    >
        {props.children}
    </MenuItem>
}
