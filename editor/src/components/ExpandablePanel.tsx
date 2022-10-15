import React, { PropsWithChildren, useCallback, useState } from "react";

import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export function ExpandablePanel({
                                    Title,
                                    children,
                                    expanded = false,
                                    padding = 1,
                                    noBottomBorder = true,
                                }: PropsWithChildren<{
    Title: React.ReactNode,
    expanded?: boolean;
    padding?: number | string,
    noBottomBorder?: boolean
}>) {

    const [expandedInternal, setExpandedInternal] = useState(expanded);
    return (
        <Accordion
            // variant={"outlined"}
                   // disableGutters
                   elevation={0}
                   expanded={expandedInternal}
                   sx={{
                       '&:before': {
                           display: 'none',
                       },
                       backgroundColor: "inherit",
                       // borderBottom: noBottomBorder ? undefined : "1px solid rgba(0, 0, 0, 0.12)",
                   }}
                   TransitionProps={{ unmountOnExit: true }}
                   onChange={useCallback((event: React.SyntheticEvent, expanded: boolean) => setExpandedInternal(expanded), [])}>
            <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                              sx={(theme) => ({
                                  // minHeight: "56px",
                                  // alignItems: "center",
                                  // borderTopLeftRadius: `8px`,
                                  // borderTopRightRadius: `8px`,
                                  // borderBottomLeftRadius: !expandedInternal ? `${theme.shape.borderRadius}px` : undefined,
                                  // borderBottomRightRadius: !expandedInternal ? `${theme.shape.borderRadius}px` : undefined,
                                  // "&.Mui-expanded": {
                                  //     borderBottom: `1px solid ${theme.palette.divider}`
                                  // },
                                  // "&.MuiAccordionSummary-root": {
                                  //     borderTopLeftRadius: `8px`,
                                  //     borderTopRightRadius: `8px`,
                                  // },
                                  // "& .MuiAccordionSummary-content": {
                                  //     // marginLeft: theme.spacing(1)
                                  // }
                              })}>
                {Title}
            </AccordionSummary>
            <AccordionDetails sx={(theme) => ({
                // border: `1px solid ${theme.palette.divider}`,
                padding: 2,
                // marginLeft: 2
            })}>
                {children}
            </AccordionDetails>
        </Accordion>
    )
}
