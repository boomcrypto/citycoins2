import { Box, Progress, Text, useColorModeValue } from "@chakra-ui/react";
import { formatMicroAmount } from "../../store/common";

function VoteProgressBar(props: { yesTotal: number; noTotal: number }) {
  const totalVotes = Number(props.yesTotal) + Number(props.noTotal);
  const yesVotePercentage = (props.yesTotal / totalVotes) * 100;

  return (
    <Box width="100%">
      <Progress
        value={yesVotePercentage}
        size="lg"
        bgColor={useColorModeValue("red.500", "red.200")}
        colorPalette="green"
      />
      <Box display="flex" flexWrap="wrap" justifyContent="space-between" mt={2}>
        <Text
          color={useColorModeValue("green.500", "green.200")}
        >{`Yes: ${formatMicroAmount(props.yesTotal)} CityCoins`}</Text>
        <Text
          color={useColorModeValue("red.500", "red.200")}
        >{`No: ${formatMicroAmount(props.noTotal)} CityCoins`}</Text>
      </Box>
    </Box>
  );
}

export default VoteProgressBar;
