import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'

const questions = [
  {
    question: 'How does NutraAI work?',
    answer: 'NutraAI is being built to bring wellness tools, personal preferences, and product information together. Account and assessment services are not connected yet.',
  },
  {
    question: 'What does the health assessment include?',
    answer: 'The assessment is being designed to help you reflect on everyday habits, preferences, and wellness goals. It is not a diagnosis and does not replace advice from a qualified healthcare professional.',
  },
  {
    question: 'How are personalized recommendations created?',
    answer: 'Recommendations will be available only after the relevant account and recommendation services are connected. They will not replace professional medical advice or treatment.',
  },
  {
    question: 'Can the AI wellness assistant provide medical advice?',
    answer: 'The AI assistant is not connected. Any future assistant experience will not replace a qualified healthcare professional or provide diagnosis or treatment.',
  },
  {
    question: 'Are the products and membership plans available now?',
    answer: 'The Free, Monthly, and Yearly plan options are displayed with their approved pricing. Account, product, subscription, and payment services are not connected, so no purchases or subscription changes can be made.',
  },
  {
    question: 'Is my wellness information private?',
    answer: 'We take privacy seriously. Before sharing sensitive information, please review the privacy information that will be provided when the assessment experience becomes available.',
  },
]

function FAQ() {
  const [openQuestion, setOpenQuestion] = useState(0)

  return (
    <section className="section faq-section">
      <div className="faq-intro">
        <span className="eyebrow">Good to know</span>
        <h2>A few things<br /><em>you might wonder.</em></h2>
        <p>Have another question? We would love to hear from you.</p>
        <Link className="text-link" to="/contact">Talk to our team <span aria-hidden="true">→</span></Link>
      </div>
      <div className="faq-list">
        {questions.map(({ question, answer }, index) => {
          const isOpen = openQuestion === index
          const answerId = `faq-answer-${index}`
          return (
            <article className={`faq-item${isOpen ? ' faq-item--open' : ''}`} key={question}>
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenQuestion(isOpen ? -1 : index)}
                >
                  <span>{question}</span>
                  <ChevronDown size={18} />
                </button>
              </h3>
              <p id={answerId} hidden={!isOpen}>{answer}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default FAQ
