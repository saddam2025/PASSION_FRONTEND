import { useLanguage } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { RichTextRenderer } from '../RichTextRenderer';
import { SectionImage, SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
import { useCoursePage } from '../CoursePageContext';
import { ExpandableCard } from '../ExpandableCard';
import { hasRichText } from '@/schemas/sections/richText';
export default function InstructorRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { course } = useCoursePage();
  if (section.type !== 'instructor') return null;
  const c = section.content;
  const image = c.photo ?? course.instructor?.photo;
  const name = c.name.ar.trim() ? c.name : course.instructor?.name ?? c.name;
  const title = c.title?.ar.trim() ? c.title : course.instructor?.title ?? c.title;
  const bioValue = hasRichText(c.bio) ? c.bio : course.instructor?.bio ?? c.bio;
  const photo = image && (
    <SectionImage
      image={image}
      language={language}
      width={600}
      height={750}
      className="aspect-[4/5] w-full rounded-md object-cover"
    />
  );
  const bio = (
    <div>
      <SectionHeading title={name} subtitle={title} language={language} />
      <RichTextRenderer value={bioValue} />
      {c.credentials.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{c.credentials.map((credential, index) => <ExpandableCard key={index} title={credential.text} details={credential.details} detailsMode={credential.detailsMode} />)}</div>
      )}
    </div>
  );
  return (
    <SectionFrame settings={section.settings} id={section.id}>
      <div className="section-split">
        {c.layout === 'photoStart' ? (
          <>
            {photo}
            {bio}
          </>
        ) : (
          <>
            {bio}
            {photo}
          </>
        )}
      </div>
    </SectionFrame>
  );
}
