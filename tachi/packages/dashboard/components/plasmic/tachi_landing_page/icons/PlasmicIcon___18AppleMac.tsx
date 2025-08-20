/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type _18AppleMacIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function _18AppleMacIcon(props: _18AppleMacIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 18 18"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"currentColor"}
        d={
          "M5.995 16.03a3.3 3.3 0 0 1-.756-.7 9 9 0 0 1-.647-.885A8.6 8.6 0 0 1 3.51 12.23a8.3 8.3 0 0 1-.451-2.647c0-.956.206-1.79.609-2.491a3.5 3.5 0 0 1 1.276-1.329 3.4 3.4 0 0 1 1.726-.512q.321 0 .687.092c.176.049.389.128.65.225.334.128.516.207.577.226.195.073.359.103.486.103.098 0 .237-.03.392-.08.089-.03.256-.084.493-.188.234-.085.42-.158.568-.213a5 5 0 0 1 .638-.158 3 3 0 0 1 .698-.03c.431.03.826.12 1.179.255.62.25 1.12.64 1.493 1.194a3.7 3.7 0 0 0-1.188 1.252 3.1 3.1 0 0 0-.392 1.534c.01.66.177 1.24.511 1.742.235.365.55.678.932.935.189.128.354.216.51.274a7 7 0 0 1-.245.67 8.6 8.6 0 0 1-.76 1.407 13 13 0 0 1-.626.859c-.244.292-.48.511-.717.668a1.6 1.6 0 0 1-.883.265 2 2 0 0 1-.628-.077 6 6 0 0 1-.52-.197 4 4 0 0 0-.55-.207 2.8 2.8 0 0 0-1.412-.001 4 4 0 0 0-.552.198c-.255.106-.422.176-.52.207a2.7 2.7 0 0 1-.601.107c-.316 0-.61-.092-.903-.275zM10.16 4.788c-.413.207-.806.295-1.199.266-.06-.394 0-.798.164-1.241.146-.378.34-.719.608-1.023.28-.317.614-.579.99-.768q.602-.309 1.15-.334c.048.414 0 .822-.153 1.26-.138.39-.345.75-.607 1.072a3.1 3.1 0 0 1-.964.767z"
        }
      ></path>
    </svg>
  );
}

export default _18AppleMacIcon;
/* prettier-ignore-end */
