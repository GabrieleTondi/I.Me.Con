import fs from "fs/promises";
import path from "path";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FileText, FileSpreadsheet, Download, FileArchive } from "lucide-react";

interface ModuloFile {
  filename: string;
  displayName: string;
  sizeFormatted: string;
  extension: string;
}

export const dynamic = "force-dynamic";

export default async function ModulisticaPage() {
  const modulisticaDir = path.join(process.cwd(), "imecon modulistica");
  let filesList: ModuloFile[] = [];

  try {
    const rawFiles = await fs.readdir(modulisticaDir);
    
    for (const filename of rawFiles) {
      const filePath = path.join(modulisticaDir, filename);
      const stat = await fs.stat(filePath);
      
      if (stat.isFile()) {
        const ext = path.extname(filename).toLowerCase();
        
        // Formatta il nome visivo del file (es: "Codice_Etico.pdf" -> "Codice Etico")
        const nameWithoutExt = path.basename(filename, ext);
        const displayName = nameWithoutExt
          .replace(/[_-]/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");

        // Formatta la dimensione del file
        let sizeFormatted = "";
        if (stat.size >= 1024 * 1024) {
          sizeFormatted = `${(stat.size / (1024 * 1024)).toFixed(2)} MB`;
        } else {
          sizeFormatted = `${(stat.size / 1024).toFixed(0)} KB`;
        }

        filesList.push({
          filename,
          displayName,
          sizeFormatted,
          extension: ext,
        });
      }
    }
  } catch (error) {
    console.error("Errore nel caricamento della modulistica:", error);
  }

  // Ordina i file alfabeticamente per nome visivo
  filesList.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <main className="flex min-h-screen flex-col bg-brand-bg text-gray-800 selection:bg-brand-accent/20 selection:text-white justify-between">
      <Header />

      {/* SEZIONE HERO */}
      <section className="relative pt-36 pb-20 bg-brand-primary text-white overflow-hidden">
        {/* Cerchi atmosferici decorativi */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-brand-accent/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[300px] h-[300px] bg-brand-secondary/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center space-y-4">
          <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-brand-accent bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            Documentazione Ufficiale
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-chillax leading-tight tracking-tight">
            Modulistica e Regolamenti
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base font-sans font-medium">
            Accedi e scarica la modulistica ministeriale ed interna fornita dall&apos;Istituto I.Me.Con per l&apos;avvio e l&apos;adesione alle procedure di mediazione civile e commerciale.
          </p>
        </div>
      </section>

      {/* GRIGLIA MODULI */}
      <section className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 py-16 md:py-24">
        {filesList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-lg mx-auto">
            <FileArchive className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-gray-700">Modulistica non disponibile</h3>
            <p className="text-gray-400 text-xs mt-1">Nessun documento è stato caricato nella directory di modulistica.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filesList.map((file) => {
              // Rileva l'icona ed il colore del badge in base all'estensione
              const isPdf = file.extension === ".pdf";
              const isExcel = file.extension === ".xlsx" || file.extension === ".xls";
              
              return (
                <div
                  key={file.filename}
                  className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-brand-secondary/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Icona della card */}
                    <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-2xl ${
                        isPdf ? "bg-red-50 text-red-600" :
                        isExcel ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {isExcel ? <FileSpreadsheet size={28} /> : <FileText size={28} />}
                      </div>
                      
                      {/* Badge estensione */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded ${
                        isPdf ? "bg-red-100 text-red-800" :
                        isExcel ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {file.extension.replace(".", "")}
                      </span>
                    </div>

                    {/* Dettagli File */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-gray-900 text-base md:text-lg leading-snug group-hover:text-brand-secondary transition-colors line-clamp-2" title={file.displayName}>
                        {file.displayName}
                      </h3>
                      <p className="text-gray-400 text-xs font-semibold">
                        Dimensione: {file.sizeFormatted}
                      </p>
                    </div>
                  </div>

                  {/* Pulsante Download */}
                  <a
                    href={`/api/modulistica?file=${encodeURIComponent(file.filename)}`}
                    className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-white bg-brand-secondary hover:bg-brand-primary rounded-2xl transition-all shadow-sm group-hover:shadow cursor-pointer"
                  >
                    <Download size={14} />
                    Scarica Documento
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
