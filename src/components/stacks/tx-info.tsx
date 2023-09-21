import { Text } from "@chakra-ui/react";
import { FinishedTxData } from "micro-stacks/connect";

function TxInfo({ txData }: { txData: FinishedTxData }) {
  return <Text>{JSON.stringify(txData, null, 2)}</Text>;
}

export default TxInfo;
