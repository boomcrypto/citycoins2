import { Link, Text } from "@chakra-ui/react";
import { FinishedTxData } from "micro-stacks/connect";

function TxInfo({ txData }: { txData: FinishedTxData }) {
  return (
    <Text>
      Transaction submitted!{" "}
      <Link isExternal href={`https://explorer.hiro.so/txid/${txData.txId}`}>
        View on explorer.
      </Link>
    </Text>
  );
}

export default TxInfo;
