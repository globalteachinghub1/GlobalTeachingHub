-- The Arabic Language course was created by renaming the seeded "Computer
-- Courses" course in the admin panel, which left it at the URL
-- /courses/computer-courses. Give it a slug that matches its content; the
-- course page permanently redirects the old slug (RENAMED_COURSE_SLUGS in
-- src/app/[locale]/courses/[slug]/page.tsx). Databases where the course is
-- still "Computer Courses" are left untouched.
UPDATE "Course"
SET "slug" = 'arabic-language'
WHERE "slug" = 'computer-courses'
  AND "name" ILIKE '%arabic%'
  AND NOT EXISTS (SELECT 1 FROM "Course" WHERE "slug" = 'arabic-language');
