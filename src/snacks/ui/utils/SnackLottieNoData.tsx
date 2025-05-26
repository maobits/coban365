// src/components/shared/SnackLottieNoData.tsx
import React from "react";
import Lottie from "lottie-react";
import animationData from "../../../ingredients/lotties/lottie-no-data.json";
import { Typography, Box } from "@mui/material";

interface Props {
  width?: number;
  height?: number;
  message?: string;
}

const SnackLottieNoData: React.FC<Props> = ({
  width = 280,
  height = 280,
  message = "No hay datos disponibles",
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      mt={4}
    >
      <Box sx={{ width, height }}>
        <Lottie
          animationData={animationData}
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </Box>
      <Typography variant="h6" color="textSecondary" mt={2} textAlign="center">
        {message}
      </Typography>
    </Box>
  );
};

export default SnackLottieNoData;
