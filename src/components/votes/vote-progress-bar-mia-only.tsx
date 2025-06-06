import { Box, Progress, Text, useColorModeValue } from "@chakra-ui/react";
import { formatMicroAmount } from "../../store/common";
import { Ccip019VoteTotals } from "../../store/ccip-019";
import { Ccip024VoteTotals } from "../../store/ccip-024";

interface VoteProgressBarMiaOnlyProps {
  props: Ccip019VoteTotals | Ccip024VoteTotals;
}

function VoteProgressBarMiaOnly({ props }: VoteProgressBarMiaOnlyProps) {
  const totalAmountYes = parseInt(props.totals.totalAmountYes);
  const totalAmountNo = parseInt(props.totals.totalAmountNo);
  const totalVotesAmount = totalAmountYes + totalAmountNo;
  const yesVotePercentage = (totalAmountYes / totalVotesAmount) * 100;

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
          title={`MIA ${formatMicroAmount(totalAmountYes)}`}
          color={useColorModeValue("green.500", "green.200")}
        >{`Yes: ${formatMicroAmount(totalAmountYes)} MIA`}</Text>
        <Text
          title={`MIA ${formatMicroAmount(totalAmountNo)}`}
          color={useColorModeValue("red.500", "red.200")}
        >{`No: ${formatMicroAmount(totalAmountNo)} MIA`}</Text>
      </Box>
    </Box>
  );
}

export default VoteProgressBarMiaOnly;
