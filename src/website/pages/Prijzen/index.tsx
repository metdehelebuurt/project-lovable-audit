import { BillingProvider } from "@/website/components/prijzen/BillingProvider";
import { S01 } from "./S01";
import { S02 } from "./S02";
import { S03 } from "./S03";
import { S04 } from "./S04";
import { S05 } from "./S05";
import { S06 } from "./S06";
import { S07 } from "./S07";
import { S08 } from "./S08";
import { S09 } from "./S09";

const Prijzen = () => (
  <main id="mh-main">
    <BillingProvider>
      <S01 />
      <S02 />
    </BillingProvider>
    <S03 />
    <S04 />
    <S05 />
    <S06 />
    <S07 />
    <S08 />
    <S09 />
  </main>
);

export default Prijzen;
