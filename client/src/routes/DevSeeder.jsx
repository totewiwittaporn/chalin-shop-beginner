// client/src/routes/DevSeeder.jsx
import { useState } from 'react';
import { useDataStore } from '../store/dataStore.js';
export default function DevSeeder() {
  const { loadDataset, resetAll } = useDataStore();
  const [loaded, setLoaded] = useState(false);
  const onLoad = async () => {
    const res = await fetch('/src/store/fixtures.full-demo.json');
    const data = await res.json();
    resetAll();
    loadDataset(data);
    setLoaded(true);
    alert('โหลดข้อมูลจำลอง Full Demo เรียบร้อย');
  };
  return (
    <div className="p-6 grid gap-4">
      <h1 className="text-2xl font-semibold">Dev Seeder</h1>
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={onLoad}>โหลดข้อมูลจำลอง (Full Demo)</button>
        <button className="btn btn-outline" onClick={()=> {resetAll(); setLoaded(false);}}>ล้างข้อมูล</button>
      </div>
      <div className="opacity-70">{loaded ? '✅ โหลดแล้ว' : 'ยังไม่โหลด'}</div>
    </div>
  );
}
