import { Badge, Box, Text } from "@chakra-ui/react";

function VoteTitle(props: { title: string; status: string; color: string }) {
  return (
    <Box
      as="span"
      fontWeight="bold"
      flex="1"
      display="flex"
      flexDirection={["column", "row"]}
      justifyContent="space-between"
      alignItems={["left", "center"]}
      textAlign="left"
    >
      <Text>{props.title}</Text>
      <Badge minW={100} textAlign="center" colorScheme={props.color} p={[2, 4]}>
        {props.status}
      </Badge>
    </Box>
  );
}

export default VoteTitle;
