import React from "react";
import Lottie from "lottie-react";
import animationData from "../../../ingredients/lotties/lottie-money.json";

interface SnackLottieMoneyProps {
  width?: number;
  height?: number;
  loop?: boolean;
}

const SnackLottieMoney: React.FC<SnackLottieMoneyProps> = ({
  width = 200,
  height = 200,
  loop = true,
}) => {
  return (
    <div style={{ width, height, margin: "0 auto" }}>
      <Lottie animationData={animationData} loop={loop} />
    </div>
  );
};

export default SnackLottieMoney;
