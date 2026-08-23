-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "params" JSONB;

-- CreateTable
CREATE TABLE "ProgressNoteTranslation" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressNoteTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgressNoteTranslation_noteId_locale_key" ON "ProgressNoteTranslation"("noteId", "locale");

-- AddForeignKey
ALTER TABLE "ProgressNoteTranslation" ADD CONSTRAINT "ProgressNoteTranslation_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "ProgressNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
