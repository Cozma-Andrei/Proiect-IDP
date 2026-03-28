const validationMessages: { [key: string]: string } = {
    'string.base': 'trebuie să fie un text',
    'string.empty': 'nu poate fi un câmp gol',
    'string.min': 'trebuie să aibă o lungime minimă de {#limit} caractere',
    'string.max': 'should have a minimum length of {#limit}',
    'string.alphanum': 'trebuie să conțină doar caractere alfanumerice',
    'string.pattern.base': 'trebuie să respecte formatul',
    'any.required': 'este un câmp obligatoriu',
    'any.only': 'trebuie să fie una dintre: {#valids}',
    'any.invalid': 'este invalid',
    'date.base': 'trebuie să fie o dată validă',
    'date.min': 'nu poate fi în trecut',
    'date.max': 'nu poate fi în viitor',
};

export default validationMessages;
