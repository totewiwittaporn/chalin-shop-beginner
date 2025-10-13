import api from "@/lib/api";

/** upload slip/evidence
 * @param {File} file
 * @returns {Promise<{id:string,url:string,filename:string,size:number,mimetype:string}>}
 */
export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/api/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
