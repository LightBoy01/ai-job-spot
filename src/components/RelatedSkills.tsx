
import React from 'react';
import Link from 'next/link';

interface RelatedSkillsProps {
  skills: { type: 'skill' | 'location'; value: string }[];
  currentSkill?: string;
}

const RelatedSkills: React.FC<RelatedSkillsProps> = ({ skills, currentSkill }) => {
  if (!skills || skills.length === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200 mt-8 mb-8">
      <h3 className="text-lg font-serif font-bold text-primary-dark mb-4">
        Related Skills & Technologies
      </h3>
      <p className="text-sm text-neutral-600 mb-4">
        Professionals who know <strong>{currentSkill || 'this skill'}</strong> often also have expertise in:
      </p>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Link
            key={skill.value}
            href={skill.type === 'skill' 
              ? `/tags/${encodeURIComponent(skill.value.toLowerCase())}` 
              : `/jobs/location/${encodeURIComponent(skill.value.toLowerCase())}`
            }
            className="text-sm bg-white border border-neutral-300 text-neutral-700 px-3 py-1.5 rounded-full hover:border-secondary hover:text-secondary-dark transition-colors shadow-sm"
          >
            {skill.value}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedSkills;
