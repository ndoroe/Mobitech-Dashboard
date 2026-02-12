import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  IconButtonProps,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Stack,
  Typography,
} from "@mui/material";
import { IconCheck } from "@tabler/icons-react";
import { FC, useState } from "react";
import { useFetcher, useNavigate, useRouteLoaderData } from "react-router-dom";
import { TUser } from "../../services/auth";
import { LetterAvatar } from "../LetterAvatar";
import { TMenuItem } from "./NavMenu";

export const UserMenu: FC<IconButtonProps> = ({ onClick, sx }) => {
  const navigate = useNavigate();
  const { user } = useRouteLoaderData("root") as { user: TUser };
  const fetcher = useFetcher();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLButtonElement>(
    null,
  );

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElUser(event.currentTarget);
    if (onClick) onClick(event);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleMenuItemClick = (item: TMenuItem) => {
    handleCloseUserMenu();

    if (item.onClick) item.onClick();
    else if (item.link) navigate(item.link);
  };

  const items: TMenuItem[] = [
    {
      link: "/profile",
      label: "Profile",
    },
    {
      link: "/settings",
      label: "Settings",
    },
    {
      divider: true,
    },
  ];

  const isLoggingOut = fetcher.formData != null;

  return (
    <>
      <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ...sx }}>
        <LetterAvatar
          src={user?.avatar}
          name={user?.name || user?.email}
          size={36}
        />
      </IconButton>
      <Menu
        sx={{ mt: "45px" }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
        PaperProps={{
          sx: {
            minWidth: { xs: 200, sm: 240 },
            maxHeight: { xs: '70vh', sm: 500 },
          }
        }}
      >
        <MenuList dense>
          <MenuItem>
            <LetterAvatar
              src={user?.avatar}
              name={user?.name || user?.email}
              size={40}
            />
            <Box pl={1} flex={1}>
              {user?.username && (
                <Typography variant="body2" fontWeight={600}>
                  {user.username}
                </Typography>
              )}
              {user?.email && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {user.email}
                </Typography>
              )}
              {user?.role && (
                <Chip 
                  label={user.role.toUpperCase()} 
                  size="small" 
                  color={user.role === "admin" ? "secondary" : "default"}
                  sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Box>
          </MenuItem>
          <Divider />
          {items.map((item, index) =>
            item.divider ? (
              <Divider key={index} />
            ) : item.group ? (
              <Typography
                key={index}
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: 12,
                  paddingLeft: 2,
                }}
              >
                {item.label}
              </Typography>
            ) : (
              <MenuItem
                key={index}
                onClick={() => handleMenuItemClick(item)}
                sx={{
                  backgroundColor: (theme) =>
                    item.selected
                      ? alpha(theme.palette.primary.main, 0.16)
                      : undefined,
                }}
              >
                <ListItemText>{item.label}</ListItemText>
                {item.selected && <IconCheck />}
              </MenuItem>
            ),
          )}
          <fetcher.Form
            method="post"
            action="/logout"
            style={{ width: "100%" }}
          >
            <Button type="submit" disabled={isLoggingOut} fullWidth>
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </fetcher.Form>
        </MenuList>
      </Menu>
    </>
  );
};
