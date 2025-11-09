import 'express';
declare global{
    namespace Express{
        interface Request{
            user?:{
                id:string;
                role:'student'|'organizer'|'admin';
                organizerStatus?: 'pending'|'approved'|'denied'|'revoked';
            };
        }
    }
}
export{};