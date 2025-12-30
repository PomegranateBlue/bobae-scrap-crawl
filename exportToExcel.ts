import XLSX from "xlsx";
import path from "path";

/**
 * 컬렉션 인터페이스
 */
export interface Collection {
  title: string;
  url: string;
}

/**
 * 컬렉션 데이터를 Excel 파일로 내보내기
 * @param collections - 컬렉션 배열
 * @param filename - 저장할 파일명 (기본값: "instagram_collections.xlsx")
 * @returns 저장된 파일 경로
 */
export function exportToExcel(
  collections: Collection[],
  filename: string = "instagram_collections.xlsx"
): string {
  try {
    // 1. 데이터를 Excel 형식으로 변환
    const worksheetData = [
      ["제목", "URL"], // 헤더 행
      ...collections.map((c) => [c.title, c.url]), // 데이터 행
    ];

    // 2. 워크시트 생성
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // 3. 열 너비 자동 조정
    const columnWidths = [
      { wch: 50 }, // 제목 열 너비 (50자)
      { wch: 80 }, // URL 열 너비 (80자)
    ];
    worksheet["!cols"] = columnWidths;

    // 4. 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "컬렉션 목록");

    // 5. 파일 경로 생성
    const currentDir = process.cwd();
    const filePath = path.join(currentDir, filename);

    // 6. Excel 파일로 저장
    XLSX.writeFile(workbook, filePath);

    console.log(`\n✅ Excel 파일이 저장되었습니다: ${filePath}`);
    console.log(`   - 총 ${collections.length}개의 컬렉션이 포함되었습니다.`);

    return filePath;
  } catch (error) {
    console.error("Excel 파일 생성 중 오류 발생:", error);
    throw error;
  }
}

/**
 * 타임스탬프가 포함된 파일명 생성
 * @returns "instagram_collections_20231218_143022.xlsx" 형식의 파일명
 */
export function generateTimestampFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `instagram_collections_${year}${month}${day}_${hour}${minute}${second}.xlsx`;
}
