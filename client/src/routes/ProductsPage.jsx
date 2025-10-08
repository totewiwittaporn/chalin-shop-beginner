"use client";

import { useState, useEffect } from "react";
import { Card } from "../components/ui/Card";
import Button from "../components/ui/Button";
import axios from "../lib/axios";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // ดึงข้อมูลจาก API (หรือ mock data)
    axios.get("/products").then((res) => setProducts(res.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">รายการสินค้า</h1>

      <Card>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Barcode</th>
              <th className="p-2 border">ชื่อสินค้า</th>
              <th className="p-2 border">ประเภทสินค้า</th>
              <th className="p-2 border text-right">ราคาขาย</th>
              <th className="p-2 border text-right">ราคาซื้อ</th>
              <th className="p-2 border text-center">เครื่องมือ</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-2 border">{p.barcode}</td>
                <td className="p-2 border">{p.name}</td>
                <td className="p-2 border">{p.category?.name}</td>
                <td className="p-2 border text-right">{p.salePrice?.toLocaleString()} ฿</td>
                <td className="p-2 border text-right">{p.costPrice?.toLocaleString()} ฿</td>
                <td className="p-2 border text-center">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(p.id)}>
                    แก้ไข
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );

  function handleEdit(id) {
    // TODO: เปิด modal หรือไปหน้าแก้ไข
    console.log("Edit product:", id);
  }
}
