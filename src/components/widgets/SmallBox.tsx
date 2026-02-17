import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardProps,
  Typography,
} from "@mui/material";
import { IconLink } from "@tabler/icons-react";
import { FC, ReactNode } from "react";

interface Props extends CardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  actionText?: string;
  actionLink?: string;
  color?: string;
}

export const SmallBox: FC<Props> = ({
  title,
  value,
  icon,
  actionText,
  actionLink,
  color,
  onClick,
  sx,
  ...props
}) => {
  return (
    <Card
      sx={{
        ...(color ? { backgroundColor: color, color: "white" } : {}),
        ...(onClick ? { 
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          }
        } : {}),
        ...sx,
      }}
      onClick={onClick}
      {...props}
    >
      <CardContent sx={{ position: "relative", p: { xs: 1.5, sm: 2 } }}>
        {icon && (
          <Box
            sx={{
              position: "absolute",
              top: { xs: 4, sm: 8 },
              right: { xs: 4, sm: 8 },
              color: "rgba(0, 0, 0, 0.15)",
              '& > svg': {
                width: { xs: 40, sm: 70 },
                height: { xs: 40, sm: 70 },
              },
            }}
          >
            {icon}
          </Box>
        )}
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>{value}</Typography>
        <Typography 
          color={color ? "white" : "text.secondary"}
          sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
        >
          {title}
        </Typography>
      </CardContent>
      {actionLink && (
        <CardActions
          sx={{
            p: 0,
            justifyContent: "end",
            backgroundColor: "rgba(0, 0, 0, 0.07)",
          }}
        >
          <Button
            size="small"
            href={actionLink}
            endIcon={<IconLink size={18} />}
            sx={{
              ...color && { color: "white" },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 0.5, sm: 1 },
            }}
            fullWidth
          >
            {actionText || "More info"}
          </Button>
        </CardActions>
      )}
    </Card>
  );
};
