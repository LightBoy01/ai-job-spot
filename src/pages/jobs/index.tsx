import { GetServerSideProps } from 'next';

const JobsIndexPage = () => {
  // This component will not be rendered because of the redirect.
  // It's just a placeholder.
  return null;
};

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/',
      permanent: true, // Use true for a 308 permanent redirect
    },
  };
};

export default JobsIndexPage;
