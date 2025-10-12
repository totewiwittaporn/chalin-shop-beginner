import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Link } from "react-router-dom";

export default function QuoteViewerWelcome(){
  return (
    <div className="p-4 md:p-6">
      <div className="toolbar-glass p-4 mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg md:text-xl font-semibold">ยินดีต้อนรับ ผู้ชมใบเสนอราคา</div>
          <Link to="/quotes"><Button className="btn-white">ไปดูใบเสนอราคา</Button></Link>
        </div>
      </div>

      <Card>
        <div className="space-y-2 p-4">
          <div className="text-base md:text-lg font-medium">ค้นหาใบเสนอราคา</div>
          <div className="flex gap-3">
            <Input className="input-glass flex-1" placeholder="กรอกรหัสใบเสนอราคา (เช่น Q-0001)" />
            <Button className="btn-white">ค้นหา</Button>
          </div>
          <p className="text-muted text-sm">
            บัญชีของคุณสามารถดูใบเสนอราคาได้ หากยืนยันการสั่งซื้อแล้ว
            เราจะผูกบัญชีของคุณเข้ากับร้านฝากขายเพื่อใช้งานฟีเจอร์เต็มรูปแบบ
          </p>
        </div>
      </Card>
    </div>
  );
}
