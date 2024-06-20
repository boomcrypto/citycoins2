import { Box, Progress, Text, useColorModeValue } from "@chakra-ui/react";
import { formatMicroAmount } from "../../store/common";
import { Ccip022VoteTotals } from "../../store/ccip-022";

interface VoteProgressBarCCIP022Props {
  props: Ccip022VoteTotals;
}

function VoteProgressBarCCIP022({ props }: VoteProgressBarCCIP022Props) {
  console.log(JSON.stringify(props, null, 2));
  const totalVotes = props.totals.totalVotesYes + props.totals.totalVotesNo;
  const yesVotePercentage = (props.totals.totalAmountYes / totalVotes) * 100;

  return (
    <Box width="100%">
      <Progress
        value={yesVotePercentage}
        size="lg"
        bgColor={useColorModeValue("red.500", "red.200")}
        colorScheme="green"
      />
      <Box display="flex" flexWrap="wrap" justifyContent="space-between" mt={2}>
        <Text
          title={`NYC ${formatMicroAmount(props.nyc.totalAmountYes)}`}
          color={useColorModeValue("green.500", "green.200")}
        >{`Yes: ${formatMicroAmount(
          props.totals.totalAmountYes
        )} CityCoins`}</Text>
        <Text
          title={`NYC ${formatMicroAmount(props.nyc.totalAmountNo)}`}
          color={useColorModeValue("red.500", "red.200")}
        >{`No: ${formatMicroAmount(
          props.totals.totalAmountNo
        )} CityCoins`}</Text>
      </Box>
    </Box>
  );
}

export default VoteProgressBarCCIP022;
