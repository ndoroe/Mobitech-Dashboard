import { Link, Typography, TypographyProps } from "@mui/material";
import { FC } from "react";

const APP_VERSION = process.env.REACT_APP_VERSION || '0.1.0';

export const Copyright: FC<TypographyProps> = (props) => {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      Copyright © {new Date().getFullYear()}{" "}
      <Link href="https://github.com/ndoroe/" underline="hover">
        Edron Ndoro
      </Link>
      {" · "}v{APP_VERSION}
    </Typography>
  );
};
