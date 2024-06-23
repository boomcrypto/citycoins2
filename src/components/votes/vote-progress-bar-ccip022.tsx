import { Box, Progress, Text, useColorModeValue } from "@chakra-ui/react";
import { formatMicroAmount } from "../../store/common";
import { Ccip022VoteTotals } from "../../store/ccip-022";

interface VoteProgressBarCCIP022Props {
  props: Ccip022VoteTotals;
}

function VoteProgressBarCCIP022({ props }: VoteProgressBarCCIP022Props) {
  // console.log(JSON.stringify(props, null, 2));
  // const totalVotesYes = parseInt(props.totals.totalVotesYes);
  // const totalVotesNo = parseInt(props.totals.totalVotesNo);
  const totalAmountYes = parseInt(props.totals.totalAmountYes);
  const totalAmountNo = parseInt(props.totals.totalAmountNo);
  // const totalVotes = totalVotesYes + totalVotesNo;
  const totalVotesAmount = totalAmountYes + totalAmountNo;
  const yesVotePercentage = (totalAmountYes / totalVotesAmount) * 100;

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
          title={`NYC ${formatMicroAmount(totalAmountYes)}`}
          color={useColorModeValue("green.500", "green.200")}
        >{`Yes: ${formatMicroAmount(totalAmountYes)} CityCoins`}</Text>
        <Text
          title={`NYC ${formatMicroAmount(totalAmountNo)}`}
          color={useColorModeValue("red.500", "red.200")}
        >{`No: ${formatMicroAmount(totalAmountNo)} CityCoins`}</Text>
      </Box>
    </Box>
  );
}

export default VoteProgressBarCCIP022;
