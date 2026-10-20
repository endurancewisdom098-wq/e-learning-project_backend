 import axios from "axios";

 const API_URL = (
   process.env.BACKEND_API_URL ||
   process.env.NEXT_PUBLIC_API_URL ||
   "http://localhost:5000"
 )
   .replace(/\/api\/?$/, "")
   .replace(/\/$/, "");

 export interface Lesson {
   id: string;
   title: string;
   videoUrl: string;
   duration?: number;
 }

 export interface Course {
   id: string;
   title: string;
   description: string | null;
   thumbnail?: string;
   lessons: Lesson[];
 }

 export const getCourses = async (): Promise<Course[]> => {
   const response = await axios.get(`${API_URL}/api/courses`);

   return response.data.courses;
 };

 export const getCourse = async (courseId: string): Promise<Course> => {
   const response = await axios.get(
     `${API_URL}/api/courses/${courseId}`
   );

   return response.data.course;
 };